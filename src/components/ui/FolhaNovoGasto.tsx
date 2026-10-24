import { AnimatePresence, motion, useDragControls, useReducedMotion, type PanInfo } from 'motion/react'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { lerUltimaForma, salvarUltimaForma } from '../../data/preferencias'
import { dataDeVencimento, faturaDaCompra, parcelasDaCompra } from '../../domain/credito'
import { diaEMes, mesDaData, nomeDoMes } from '../../domain/datas'
import { formatarBRL, lerValorDigitado, valorParaDigitar } from '../../domain/dinheiro'
import { FORA_DO_PLANO } from '../../domain/resumo'
import type { Categoria, DataISO, FormaPagamento, Gasto } from '../../domain/tipos'
import { anotarGasto, editarGasto, type AvisoDoGasto } from '../../hooks/anotarGasto'
import type { ResumoCartao } from '../../hooks/usePlanoDoMes'
import { fadeRapido, molaFirme, molaSuave } from '../../ui/movimento'
import Botao from './Botao'
import Campo from './Campo'
import Segmentado, { type OpcaoSegmentada } from './Segmentado'

// Painel "Anotar gasto" (docs/05-telas-e-fluxos.md e docs/08-design.md, seção 7.7).
// Sobe de baixo; arrastar para baixo fecha. Também edita um gasto (tela Gastos).
// No crédito, com cartão cadastrado: mostra a fatura e o limite livre e aceita parcelas
// (docs/03-regras-de-negocio.md, seção 5).

const MAX_PARCELAS = 12

const ARRASTE_PARA_FECHAR = 120 // px
const VELOCIDADE_PARA_FECHAR = 600

const FORMAS: OpcaoSegmentada<FormaPagamento>[] = [
  { valor: 'pix', rotulo: 'Pix' },
  { valor: 'debito', rotulo: 'Débito' },
  { valor: 'dinheiro', rotulo: 'Dinheiro' },
  { valor: 'credito', rotulo: 'Crédito' },
]

interface FolhaNovoGastoProps {
  aberta: boolean
  onFechar: () => void
  /** Chamado depois de salvar, com o aviso para mostrar. */
  onSalvo: (aviso: AvisoDoGasto) => void
  categorias: Categoria[]
  hoje: DataISO
  /** Com um gasto, o painel abre preenchido para editar. */
  gastoParaEditar?: Gasto | null
  /** O cartão hoje (null = sem cartão cadastrado). */
  cartao?: ResumoCartao | null
}

export default function FolhaNovoGasto({
  aberta,
  onFechar,
  onSalvo,
  categorias,
  hoje,
  gastoParaEditar = null,
  cartao = null,
}: FolhaNovoGastoProps) {
  const reduzirMovimento = useReducedMotion()
  const controlesDeArraste = useDragControls()

  // Esc fecha o painel (teclado do computador)
  useEffect(() => {
    if (!aberta) return
    const aoTeclar = (e: KeyboardEvent) => e.key === 'Escape' && onFechar()
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [aberta, onFechar])

  function aoSoltar(_: unknown, info: PanInfo) {
    if (info.offset.y > ARRASTE_PARA_FECHAR || info.velocity.y > VELOCIDADE_PARA_FECHAR) onFechar()
  }

  return (
    <AnimatePresence>
      {aberta && (
        <div className="fixed inset-0 z-50">
          {/* Fundo escurecido e desfocado; tocar nele fecha */}
          <motion.div
            className="absolute inset-0 bg-[rgb(0_0_0/0.5)] backdrop-blur-[8px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={fadeRapido}
            onClick={onFechar}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={gastoParaEditar ? 'Editar gasto' : 'Anotar gasto'}
            className="vidro absolute inset-x-0 bottom-0 mx-auto flex max-h-[92dvh] max-w-lg flex-col rounded-t-[var(--r-lg)] border-b-0 pb-[env(safe-area-inset-bottom)]"
            initial={reduzirMovimento ? { opacity: 0 } : { y: '100%' }}
            animate={reduzirMovimento ? { opacity: 1 } : { y: 0 }}
            exit={reduzirMovimento ? { opacity: 0 } : { y: '100%' }}
            transition={reduzirMovimento ? fadeRapido : molaSuave}
            drag="y"
            dragControls={controlesDeArraste}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.7 }}
            onDragEnd={aoSoltar}
          >
            {/* Alça: o arraste começa só aqui, para não brigar com a rolagem do formulário */}
            <div
              aria-hidden="true"
              onPointerDown={(e) => controlesDeArraste.start(e)}
              className="flex cursor-grab touch-none justify-center pt-3 pb-3 active:cursor-grabbing"
            >
              <span className="h-1 w-9 rounded-full bg-line-strong" />
            </div>
            <Formulario
              key={gastoParaEditar?.id ?? 'novo'}
              categorias={categorias}
              hoje={hoje}
              onSalvo={onSalvo}
              gastoParaEditar={gastoParaEditar}
              cartao={cartao}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// O formulário só existe com o painel aberto: cada abertura começa limpa.
function Formulario({
  categorias,
  hoje,
  onSalvo,
  gastoParaEditar,
  cartao,
}: Pick<FolhaNovoGastoProps, 'categorias' | 'hoje' | 'onSalvo'> & {
  gastoParaEditar: Gasto | null
  cartao: ResumoCartao | null
}) {
  const idTitulo = useId()
  const campoValor = useRef<HTMLInputElement>(null)
  const editando = gastoParaEditar
  const [textoValor, setTextoValor] = useState(editando ? valorParaDigitar(editando.valor) : '')
  const [categoriaId, setCategoriaId] = useState<string | null>(editando?.categoriaId ?? null)
  const [forma, setForma] = useState<FormaPagamento>(() => editando?.forma ?? lerUltimaForma())
  const [descricao, setDescricao] = useState(editando?.descricao ?? '')
  const [data, setData] = useState(editando?.data ?? hoje)
  const [textoParcelas, setTextoParcelas] = useState(String(editando?.parcelas ?? 1))
  const [erro, setErro] = useState<{ valor?: string; categoria?: string; parcelas?: string; salvar?: string }>({})
  const [salvando, setSalvando] = useState(false)

  // Foco automático no valor, para o teclado numérico já abrir.
  useEffect(() => {
    campoValor.current?.focus()
  }, [])

  // No crédito, pela regra da fatura? (sem cartão, ou antes de regraDesde, conta no teto)
  const naFatura = forma === 'credito' && cartao !== null && !!data && mesDaData(data) >= cartao.cartao.regraDesde
  const parcelasLidas = /^\d{1,2}$/.test(textoParcelas.trim()) ? Number(textoParcelas.trim()) : null
  const parcelasValidas = parcelasLidas !== null && parcelasLidas >= 1 && parcelasLidas <= MAX_PARCELAS

  async function salvar(e: FormEvent) {
    e.preventDefault()
    const valor = lerValorDigitado(textoValor)
    const erros: typeof erro = {}
    if (valor === null || valor <= 0) erros.valor = 'Digite um valor maior que zero.'
    if (!categoriaId) erros.categoria = 'Escolha uma categoria.'
    if (!data) erros.salvar = 'Escolha a data do gasto.'
    if (naFatura && !parcelasValidas) erros.parcelas = `Digite de 1 a ${MAX_PARCELAS} parcelas.`
    setErro(erros)
    if (valor === null || valor <= 0 || !categoriaId || !data || (naFatura && !parcelasValidas)) {
      if (erros.valor) campoValor.current?.focus()
      return
    }

    setSalvando(true)
    const campos = {
      valor,
      categoriaId,
      forma,
      data,
      ...(descricao.trim() ? { descricao: descricao.trim() } : {}),
      ...(naFatura && parcelasLidas !== null && parcelasLidas > 1 ? { parcelas: parcelasLidas } : {}),
    }
    try {
      if (editando) {
        // Monta o gasto de novo, sem a descrição e as parcelas antigas: se saíram, somem mesmo.
        const { descricao: _descricaoAntiga, parcelas: _parcelasAntigas, ...semOpcionais } = editando
        onSalvo(await editarGasto({ ...semOpcionais, ...campos }))
      } else {
        const aviso = await anotarGasto(campos, hoje)
        salvarUltimaForma(forma)
        onSalvo(aviso)
      }
    } catch {
      setErro({ salvar: 'Não deu para salvar o gasto. Tente de novo.' })
      setSalvando(false)
    }
  }

  const opcoesCategoria = [
    ...categorias.map((c) => ({ id: c.id, nome: c.nome, cor: `var(--${c.cor})` })),
    { id: FORA_DO_PLANO, nome: 'Fora do plano', cor: 'var(--fg-muted)' },
  ]
  // Editando um gasto cuja categoria foi apagada: mostra a opção, para ela não sumir sem aviso.
  if (editando && !opcoesCategoria.some((opcao) => opcao.id === editando.categoriaId)) {
    opcoesCategoria.push({ id: editando.categoriaId, nome: 'Categoria apagada', cor: 'var(--fg-faint)' })
  }
  const valorExibido = textoValor.replace('.', ',')

  return (
    <form onSubmit={salvar} noValidate className="flex flex-col gap-6 overflow-y-auto px-4 pt-2 pb-4" aria-labelledby={idTitulo}>
      <h2 id={idTitulo} className="rotulo text-center text-[10px] text-fg-muted">
        {editando ? 'Editar gasto' : 'Anotar gasto'}
      </h2>

      {/* 1. Valor: o número grande é só visual; o campo de verdade fica por cima, invisível */}
      <div className="flex flex-col items-center gap-2">
        <div className="relative flex min-h-14 w-full items-center justify-center">
          <span aria-hidden="true" className="valor font-display text-[44px] leading-none">
            <span className="valor-moeda">R$</span>
            <span className={valorExibido ? '' : 'text-fg-faint'}>{valorExibido || '0'}</span>
            <span className="cursor-piscando ml-1 h-[0.9em] w-0.5 self-center bg-accent" />
          </span>
          <input
            ref={campoValor}
            aria-label="Valor"
            aria-invalid={erro.valor ? true : undefined}
            aria-describedby={erro.valor ? `${idTitulo}-erro-valor` : undefined}
            inputMode="decimal"
            autoComplete="off"
            maxLength={10}
            value={textoValor}
            onChange={(e) => setTextoValor(e.target.value.replace(/[^\d.,]/g, ''))}
            className="absolute inset-0 cursor-text opacity-0"
          />
        </div>
        {erro.valor && (
          <p id={`${idTitulo}-erro-valor`} className="text-small text-danger">
            {erro.valor}
          </p>
        )}
      </div>

      {/* 2. Categoria */}
      <fieldset className="flex flex-col gap-3">
        <legend className="rotulo mb-3 text-[10px] text-fg-muted">Categoria</legend>
        <div className="flex flex-wrap gap-2">
          {opcoesCategoria.map((opcao) => {
            const selecionada = opcao.id === categoriaId
            return (
              <button
                key={opcao.id}
                type="button"
                aria-pressed={selecionada}
                onClick={() => setCategoriaId(opcao.id)}
                className="relative flex h-12 items-center gap-2 rounded-full border border-line px-4 text-[15px] transition-transform duration-[120ms] active:scale-97"
              >
                {selecionada && (
                  <motion.span
                    layoutId="lente-categoria"
                    transition={molaFirme}
                    className="absolute inset-[-1px] rounded-full border"
                    style={{
                      borderColor: opcao.cor,
                      background: `color-mix(in srgb, ${opcao.cor} 16%, transparent)`,
                    }}
                  />
                )}
                <span aria-hidden="true" className="relative size-2 rounded-full" style={{ background: opcao.cor }} />
                <span className="relative">{opcao.nome}</span>
              </button>
            )
          })}
        </div>
        {erro.categoria && <p className="text-small text-danger">{erro.categoria}</p>}
      </fieldset>

      {/* 3. Forma de pagamento (e, no crédito, a fatura e as parcelas) */}
      <div className="flex flex-col gap-3">
        <Segmentado rotulo="Forma de pagamento" opcoes={FORMAS} valor={forma} onChange={setForma} idLente="lente-forma" />
        {forma === 'credito' && (
          <InfoDoCredito
            cartao={cartao}
            data={data}
            naFatura={naFatura}
            valor={lerValorDigitado(textoValor)}
            parcelas={parcelasValidas ? (parcelasLidas ?? 1) : 1}
          />
        )}
        {naFatura && (
          <Campo
            rotulo="Parcelas"
            inputMode="numeric"
            value={textoParcelas}
            onChange={(e) => setTextoParcelas(e.target.value)}
            erro={erro.parcelas}
            dica="1 = à vista."
          />
        )}
      </div>

      {/* 4. Descrição e 5. Data */}
      <Campo rotulo="Descrição" placeholder="Opcional" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
      <Campo rotulo="Data" type="date" value={data} onChange={(e) => setData(e.target.value)} />

      {erro.salvar && (
        <p role="alert" className="text-small text-danger">
          {erro.salvar}
        </p>
      )}

      {/* 6. Salvar */}
      <Botao type="submit" carregando={salvando} className="w-full">
        Salvar
      </Botao>
    </form>
  )
}

/** A linha de informação do crédito: em qual fatura cai, limite livre e as parcelas. */
function InfoDoCredito({
  cartao,
  data,
  naFatura,
  valor,
  parcelas,
}: {
  cartao: ResumoCartao | null
  data: DataISO
  naFatura: boolean
  valor: number | null
  parcelas: number
}) {
  if (!cartao) {
    return <p className="text-small text-fg-muted">Cadastre o cartão em Ajustes para as compras no crédito irem para a fatura.</p>
  }
  if (!naFatura) {
    return (
      <p className="text-small text-fg-muted">
        Compra de antes de {nomeDoMes(cartao.cartao.regraDesde)}: conta no teto da categoria, como antes.
      </p>
    )
  }
  const fatura = faturaDaCompra(data, cartao.cartao)
  const divididas =
    valor !== null && valor > 0 && parcelas > 1
      ? parcelasDaCompra({ id: '', data, valor, categoriaId: '', forma: 'credito', criadoEm: '', parcelas }, cartao.cartao)
      : null
  return (
    <div className="flex flex-col gap-1 text-small text-fg-muted">
      <p>
        Vai na fatura de {nomeDoMes(fatura)} (vence {diaEMes(dataDeVencimento(fatura, cartao.cartao))}) · Limite livre:{' '}
        <span className={`font-mono ${cartao.limiteLivre < 0 ? 'text-danger' : 'text-fg'}`}>{formatarBRL(cartao.limiteLivre)}</span>
      </p>
      {divididas && (
        <p>
          {parcelas}x de <span className="font-mono text-fg">{formatarBRL(divididas[0]?.valor ?? 0)}</span>, de{' '}
          {nomeDoMes(divididas[0]?.fatura ?? fatura)} a {nomeDoMes(divididas.at(-1)?.fatura ?? fatura)}
        </p>
      )}
    </div>
  )
}
